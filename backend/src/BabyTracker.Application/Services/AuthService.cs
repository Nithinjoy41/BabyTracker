using BabyTracker.Application.DTOs;
using BabyTracker.Application.Interfaces;
using BabyTracker.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace BabyTracker.Application.Services;

public class AuthService
{
    private readonly IUserRepository _users;
    private readonly IFamilyRepository _families;
    private readonly IConfiguration _config;

    public AuthService(IUserRepository users, IFamilyRepository families, IConfiguration config)
    {
        _users = users;
        _families = families;
        _config = config;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var existing = await _users.GetByEmailAsync(dto.Email);
        if (existing is not null)
            throw new InvalidOperationException("Email already registered.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = dto.Email.ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FullName = dto.FullName,
            CreatedAt = DateTime.UtcNow
        };
        await _users.CreateAsync(user);

        // Create a family for the first user
        var family = new Family
        {
            Id = Guid.NewGuid(),
            Name = $"{dto.FullName}'s Family",
            InviteCode = GenerateInviteCode(),
            CreatedAt = DateTime.UtcNow
        };
        await _families.CreateAsync(family);
        await _families.AddMemberAsync(new FamilyMember
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            FamilyId = family.Id,
            Role = "Owner",
            JoinedAt = DateTime.UtcNow
        });

        var token = GenerateJwt(user, family.Id);
        return new AuthResponseDto(token, user.Email, user.FullName, family.Id);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _users.GetByEmailAsync(dto.Email.ToLowerInvariant());
        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials.");

        var familyId = await _families.GetFamilyIdForUserAsync(user.Id);
        var token = GenerateJwt(user, familyId);
        return new AuthResponseDto(token, user.Email, user.FullName, familyId);
    }

    public async Task<FamilyResponseDto> JoinFamilyAsync(Guid userId, string inviteCode)
    {
        var family = await _families.GetByInviteCodeAsync(inviteCode)
            ?? throw new InvalidOperationException("Invalid invite code.");

        await _families.AddMemberAsync(new FamilyMember
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            FamilyId = family.Id,
            Role = "Parent",
            JoinedAt = DateTime.UtcNow
        });

        var memberNames = family.Members.Select(m => m.User.FullName);
        return new FamilyResponseDto(family.Id, family.Name, family.InviteCode, memberNames);
    }

    // ── Helpers ───────────────────────────────────────────
    private string GenerateJwt(User user, Guid? familyId)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _config["Jwt:Key"] ?? throw new InvalidOperationException("JWT key missing.")));

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.FullName)
        };
        if (familyId.HasValue)
            claims.Add(new Claim("FamilyId", familyId.Value.ToString()));

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateInviteCode()
        => Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
}
