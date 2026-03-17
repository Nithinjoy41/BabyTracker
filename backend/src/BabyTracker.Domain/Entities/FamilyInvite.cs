namespace BabyTracker.Domain.Entities;

public class FamilyInvite
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Email { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
    public DateTime CreatedAt { get; set; }

    public Family Family { get; set; } = null!;
}
