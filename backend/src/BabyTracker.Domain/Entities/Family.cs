namespace BabyTracker.Domain.Entities;

public class Family
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string InviteCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<FamilyMember> Members { get; set; } = new List<FamilyMember>();
    public ICollection<LogEntry> LogEntries { get; set; } = new List<LogEntry>();
    public ICollection<Vaccine> Vaccines { get; set; } = new List<Vaccine>();
    public ICollection<Photo> Photos { get; set; } = new List<Photo>();
}
