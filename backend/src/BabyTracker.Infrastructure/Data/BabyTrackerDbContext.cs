using BabyTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BabyTracker.Infrastructure.Data;

public class BabyTrackerDbContext : DbContext
{
    public BabyTrackerDbContext(DbContextOptions<BabyTrackerDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Family> Families => Set<Family>();
    public DbSet<FamilyMember> FamilyMembers => Set<FamilyMember>();
    public DbSet<Child> Children => Set<Child>();
    public DbSet<LogEntry> LogEntries => Set<LogEntry>();
    public DbSet<Vaccine> Vaccines => Set<Vaccine>();
    public DbSet<Photo> Photos => Set<Photo>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── User ──────────────────────────────────────────────
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.Property(u => u.Email).HasMaxLength(256).IsRequired();
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.PasswordHash).IsRequired();
            e.Property(u => u.FullName).HasMaxLength(200).IsRequired();
        });

        // ── Family ────────────────────────────────────────────
        modelBuilder.Entity<Family>(e =>
        {
            e.HasKey(f => f.Id);
            e.Property(f => f.Name).HasMaxLength(200).IsRequired();
            e.Property(f => f.InviteCode).HasMaxLength(8).IsRequired();
            e.HasIndex(f => f.InviteCode).IsUnique();
        });

        // ── FamilyMember ──────────────────────────────────────
        modelBuilder.Entity<FamilyMember>(e =>
        {
            e.HasKey(fm => fm.Id);
            e.Property(fm => fm.Role).HasMaxLength(50).IsRequired();
            e.HasIndex(fm => new { fm.UserId, fm.FamilyId }).IsUnique();

            e.HasOne(fm => fm.User)
             .WithMany(u => u.FamilyMemberships)
             .HasForeignKey(fm => fm.UserId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(fm => fm.Family)
             .WithMany(f => f.Members)
             .HasForeignKey(fm => fm.FamilyId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Child ─────────────────────────────────────────────
        modelBuilder.Entity<Child>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Name).HasMaxLength(200).IsRequired();
            e.HasIndex(c => c.FamilyId);

            e.HasOne(c => c.Family)
             .WithMany(f => f.Children)
             .HasForeignKey(c => c.FamilyId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── LogEntry ──────────────────────────────────────────
        modelBuilder.Entity<LogEntry>(e =>
        {
            e.HasKey(l => l.Id);
            e.Property(l => l.Type).HasConversion<string>().HasMaxLength(20).IsRequired();
            e.Property(l => l.Notes).HasMaxLength(1000);
            e.HasIndex(l => l.FamilyId);
            e.HasIndex(l => l.ChildId);
            e.HasIndex(l => l.Timestamp);

            e.HasOne(l => l.Family)
             .WithMany(f => f.LogEntries)
             .HasForeignKey(l => l.FamilyId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(l => l.Child)
             .WithMany(c => c.LogEntries)
             .HasForeignKey(l => l.ChildId)
             .OnDelete(DeleteBehavior.NoAction);

            e.HasOne(l => l.User)
             .WithMany(u => u.LogEntries)
             .HasForeignKey(l => l.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Vaccine ───────────────────────────────────────────
        modelBuilder.Entity<Vaccine>(e =>
        {
            e.HasKey(v => v.Id);
            e.Property(v => v.Name).HasMaxLength(200).IsRequired();
            e.Property(v => v.Notes).HasMaxLength(1000);
            e.HasIndex(v => v.FamilyId);
            e.HasIndex(v => v.ChildId);

            e.HasOne(v => v.Family)
             .WithMany(f => f.Vaccines)
             .HasForeignKey(v => v.FamilyId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(v => v.Child)
             .WithMany(c => c.Vaccines)
             .HasForeignKey(v => v.ChildId)
             .OnDelete(DeleteBehavior.NoAction);

            e.HasOne(v => v.User)
             .WithMany(u => u.Vaccines)
             .HasForeignKey(v => v.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Photo ─────────────────────────────────────────────
        modelBuilder.Entity<Photo>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Url).HasMaxLength(500).IsRequired();
            e.Property(p => p.Notes).HasMaxLength(1000);
            e.HasIndex(p => p.FamilyId);
            e.HasIndex(p => p.ChildId);

            e.HasOne(p => p.Family)
             .WithMany(f => f.Photos)
             .HasForeignKey(p => p.FamilyId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(p => p.Child)
             .WithMany(c => c.Photos)
             .HasForeignKey(p => p.ChildId)
             .OnDelete(DeleteBehavior.NoAction);

            e.HasOne(p => p.User)
             .WithMany(u => u.Photos)
             .HasForeignKey(p => p.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
