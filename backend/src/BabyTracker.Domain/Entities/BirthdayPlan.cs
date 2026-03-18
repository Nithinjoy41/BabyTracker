using System.Text.Json.Serialization;

namespace BabyTracker.Domain.Entities;

public class BirthdayPlan
{
    public Guid Id { get; set; }
    public Guid ChildId { get; set; }
    
    [JsonIgnore]
    public Child Child { get; set; } = null!;
    
    public string Theme { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public string FoodAndDrinks { get; set; } = string.Empty;
    public string AiSummary { get; set; } = string.Empty;
    public DateTime? Date { get; set; }
    
    public ICollection<BirthdayGuest> Guests { get; set; } = new List<BirthdayGuest>();
}
