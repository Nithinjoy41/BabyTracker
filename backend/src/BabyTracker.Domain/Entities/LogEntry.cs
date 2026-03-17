namespace BabyTracker.Domain.Entities;

public enum LogType
{
    Food,
    Nappy,
    Sleep
}

public class LogEntry
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public Guid ChildId { get; set; }
    public Guid UserId { get; set; }
    public LogType Type { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public int? DurationMinutes { get; set; }
    public string? Notes { get; set; }

    // Navigation
    public Family Family { get; set; } = null!;
    public Child Child { get; set; } = null!;
    public User User { get; set; } = null!;
}
