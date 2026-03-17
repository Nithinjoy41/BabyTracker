namespace BabyTracker.Domain.Entities;

public class Photo
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public Guid ChildId { get; set; }
    public Guid UserId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Family Family { get; set; } = null!;
    public Child Child { get; set; } = null!;
    public User User { get; set; } = null!;
}
