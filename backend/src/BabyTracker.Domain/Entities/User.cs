namespace BabyTracker.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<FamilyMember> FamilyMemberships { get; set; } = new List<FamilyMember>();
    public ICollection<LogEntry> LogEntries { get; set; } = new List<LogEntry>();
    public ICollection<Vaccine> Vaccines { get; set; } = new List<Vaccine>();
    public ICollection<Photo> Photos { get; set; } = new List<Photo>();
}
