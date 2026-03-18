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
    public int AdditionalAdults { get; set; }
    public int AdditionalChildren { get; set; }
    public string? SubGuestsJson { get; set; } // JSON list of names
}
