namespace BabyTracker.Domain.Entities;

public class Child
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Family Family { get; set; } = null!;
    public ICollection<LogEntry> LogEntries { get; set; } = new List<LogEntry>();
    public ICollection<Vaccine> Vaccines { get; set; } = new List<Vaccine>();
    public ICollection<Photo> Photos { get; set; } = new List<Photo>();
}
