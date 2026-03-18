using System.Text.Json.Serialization;

namespace BabyTracker.Domain.Entities;

public class BirthdayGuest
{
    public Guid Id { get; set; }
    public Guid BirthdayPlanId { get; set; }
    
    [JsonIgnore]
    public BirthdayPlan BirthdayPlan { get; set; } = null!;
    
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, Confirmed, Maybe, Declined
}
