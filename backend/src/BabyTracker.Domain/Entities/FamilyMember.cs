namespace BabyTracker.Domain.Entities;

public class FamilyMember
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid FamilyId { get; set; }
    public string Role { get; set; } = "Parent";
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
    public Family Family { get; set; } = null!;
}
