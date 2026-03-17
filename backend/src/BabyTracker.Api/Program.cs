using System.Text;
using BabyTracker.Api.Middleware;
using BabyTracker.Application.Interfaces;
using BabyTracker.Application.Services;
using BabyTracker.Infrastructure.Data;
using BabyTracker.Infrastructure.Repositories;
using BabyTracker.Infrastructure.Storage;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Sqlite;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var useSqlite = string.IsNullOrEmpty(connectionString) ||
                builder.Configuration.GetValue<bool>("UseSqlite");

// Convert postgresql:// URL to ADO.NET key-value format (Neon gives URL format but Npgsql needs key-value)
if (!string.IsNullOrEmpty(connectionString) && connectionString.StartsWith("postgresql://"))
{
    var uri = new Uri(connectionString);
    var userInfo = uri.UserInfo.Split(':');
    var query = uri.Query.TrimStart('?');
    connectionString = $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.TrimStart('/')};Username={userInfo[0]};Password={userInfo[1]};SSL Mode=Require;Trust Server Certificate=true;";
}

builder.Services.AddDbContext<BabyTrackerDbContext>(opt =>
{
    if (useSqlite)
        opt.UseSqlite($"Data Source={Path.Combine(builder.Environment.ContentRootPath, "babytracker.db")}");
    else
        opt.UseNpgsql(connectionString);
});

// ── Repositories ──────────────────────────────────────
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IFamilyRepository, FamilyRepository>();
builder.Services.AddScoped<IChildRepository, ChildRepository>();
builder.Services.AddScoped<ILogRepository, LogRepository>();
builder.Services.AddScoped<IVaccineRepository, VaccineRepository>();
builder.Services.AddScoped<IPhotoRepository, PhotoRepository>();
builder.Services.AddScoped<IInviteRepository, InviteRepository>();

// ── Services ──────────────────────────────────────────
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ChildService>();
builder.Services.AddScoped<LogService>();
builder.Services.AddScoped<VaccineService>();
builder.Services.AddScoped<PhotoService>();
builder.Services.AddScoped<InviteService>();

// ── File Storage ──────────────────────────────────────
var cloudinaryName = builder.Configuration["Cloudinary:CloudName"];
if (!string.IsNullOrEmpty(cloudinaryName))
{
    builder.Services.AddSingleton<IFileStorageService, CloudinaryStorageService>();
}
else
{
    builder.Services.AddSingleton<IFileStorageService>(
        new LocalFileStorageService(Path.Combine(builder.Environment.ContentRootPath, "uploads")));
}

// ── FluentValidation ──────────────────────────────────
builder.Services.AddValidatorsFromAssemblyContaining<BabyTracker.Application.Validators.RegisterDtoValidator>();
builder.Services.AddFluentValidationAutoValidation();

// ── JWT Authentication ────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"] ?? "BabyTrackerSuperSecretKey12345678!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "BabyTracker",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "BabyTrackerApp",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// ── Controllers + Swagger ─────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "BabyTracker API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Enter 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// ── CORS (allow Expo dev) ─────────────────────────────
builder.Services.AddCors(opt =>
    opt.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

// ── Middleware pipeline ───────────────────────────────
app.UseMiddleware<ErrorHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

// Serve uploaded files
var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "uploads");
Directory.CreateDirectory(uploadsPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Auto-create database (supports both SQLite and PostgreSQL)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BabyTrackerDbContext>();
    try
    {
        // Try to query the new Children table.
        // If it fails (e.g. table doesn't exist), we know the schema is old.
        _ = db.Children.Take(1).ToList();
    }
    catch
    {
        // If it throws an exception, the schema is outdated.
        if (db.Database.IsNpgsql())
        {
            // Neon DB: drop the tables manually instead of dropping the entire DB
            // because dropping the DB breaks connections and permissions on managed hosts.
            db.Database.ExecuteSqlRaw("DROP TABLE IF EXISTS \"FamilyMembers\", \"LogEntries\", \"Photos\", \"Vaccines\", \"Children\", \"Families\", \"Users\" CASCADE;");
        }
        else
        {
            // SQLite: Safe to just delete the local file
            db.Database.EnsureDeleted();
        }
    }
    
    db.Database.EnsureCreated();
}

app.Run();
