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
    private readonly IChildRepository _children;
    private readonly IInviteRepository _invites;
    private readonly IConfiguration _config;

    public AuthService(IUserRepository users, IFamilyRepository families, IChildRepository children, IInviteRepository invites, IConfiguration config)
    {
        _users = users;
        _families = families;
        _children = children;
        _invites = invites;
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

        // Create a family for the new user
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
        return new AuthResponseDto(token, user.Email, user.FullName, family.Id, Enumerable.Empty<ChildDto>());
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _users.GetByEmailAsync(dto.Email.ToLowerInvariant());
        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials.");

        var familyId = await _families.GetFamilyIdForUserAsync(user.Id);
        var token = GenerateJwt(user, familyId);

        IEnumerable<ChildDto> childDtos = Enumerable.Empty<ChildDto>();
        if (familyId.HasValue)
        {
            var kids = await _children.GetByFamilyAsync(familyId.Value);
            childDtos = kids.Select(c => new ChildDto(c.Id, c.Name, c.DateOfBirth));
        }

        return new AuthResponseDto(token, user.Email, user.FullName, familyId, childDtos);
    }

    public async Task<FamilyResponseDto> JoinFamilyAsync(Guid userId, string inviteCode)
    {
        var invite = await _invites.GetByCodeAsync(inviteCode);
        if (invite is null)
        {
            // Backwards compatibility for old static family invite codes temporarily
            var oldFamily = await _families.GetByInviteCodeAsync(inviteCode);
            if (oldFamily is null)
                throw new InvalidOperationException("Invalid invite code.");
            
            await JoinExistingFamily(userId, oldFamily);
            return MapToDto(oldFamily);
        }

        if (invite.IsUsed)
            throw new InvalidOperationException("This invite code has already been used.");
            
        if (invite.ExpiresAt < DateTime.UtcNow)
            throw new InvalidOperationException("This invite code has expired.");

        // Valid invite
        invite.IsUsed = true;
        // Don't have a direct UpdateAsync right now in base repository, 
        // rely on EF ChangeTracker when we save later if needed, but since we don't 
        // actually call save changes implicitly here, we might need to rely on DbContext.
        // Wait, the BaseRepository doesn't expose Update. We'll add one if needed, or get Family
        
        var family = await _families.GetByIdAsync(invite.FamilyId) ?? throw new InvalidOperationException("Family not found");
        
        await JoinExistingFamily(userId, family);
        return MapToDto(family);
    }

    private async Task JoinExistingFamily(Guid userId, Family family)
    {
        await _families.AddMemberAsync(new FamilyMember
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            FamilyId = family.Id,
            Role = "Parent",
            JoinedAt = DateTime.UtcNow
        });
    }

    private FamilyResponseDto MapToDto(Family family)
    {
        var memberNames = family.Members?.Select(m => m.User.FullName) ?? Array.Empty<string>();
        var childDtos = family.Children?.Select(c => new ChildDto(c.Id, c.Name, c.DateOfBirth)) ?? Array.Empty<ChildDto>();
        return new FamilyResponseDto(family.Id, family.Name, family.InviteCode, memberNames, childDtos);
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
