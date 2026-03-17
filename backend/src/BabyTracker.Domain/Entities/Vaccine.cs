namespace BabyTracker.Domain.Entities;

public class Vaccine
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public Guid ChildId { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string? Notes { get; set; }

    // Navigation
    public Family Family { get; set; } = null!;
    public Child Child { get; set; } = null!;
    public User User { get; set; } = null!;
}
