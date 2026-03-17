using BabyTracker.Application.DTOs;
using BabyTracker.Application.Interfaces;
using BabyTracker.Domain.Entities;

namespace BabyTracker.Application.Services;

public class InviteService
{
    private readonly IInviteRepository _invites;
    private readonly IFamilyRepository _families;

    public InviteService(IInviteRepository invites, IFamilyRepository families)
    {
        _invites = invites;
        _families = families;
    }

    public async Task<string> GenerateInviteAsync(Guid familyId, string? email)
    {
        // Generate a 6-character random alphanumeric code
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        var code = new string(Enumerable.Repeat(chars, 6)
            .Select(s => s[random.Next(s.Length)]).ToArray());

        var invite = new FamilyInvite
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId,
            Code = code,
            Email = email,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };

        await _invites.CreateAsync(invite);

        // Simulate sending an email:
        Console.WriteLine("\n------------------------------------------------");
        Console.WriteLine($"[EMAIL SENT] To: {email ?? "Anyone"}");
        Console.WriteLine($"[EMAIL SENT] Subject: You've been invited to BabyTracker!");
        Console.WriteLine($"[EMAIL SENT] Body: Use this code to join: {code}");
        Console.WriteLine($"[EMAIL SENT] This code expires in 7 days.");
        Console.WriteLine("------------------------------------------------\n");

        return code;
    }
}
