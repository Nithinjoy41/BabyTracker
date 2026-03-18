using BabyTracker.Application.DTOs;
using BabyTracker.Application.Interfaces;
using BabyTracker.Domain.Entities;

namespace BabyTracker.Application.Services;

public class BirthdayService
{
    private readonly IBirthdayRepository _birthdays;
    public BirthdayService(IBirthdayRepository birthdays) => _birthdays = birthdays;

    public async Task<BirthdayPlanDto> GetOrCreatePlanAsync(Guid childId)
    {
        var plan = await _birthdays.GetByChildIdAsync(childId);
        if (plan == null)
        {
            plan = new BirthdayPlan
            {
                Id = Guid.NewGuid(),
                ChildId = childId,
                Theme = "To be decided",
                Location = "Home"
            };
            await _birthdays.CreateAsync(plan);
        }
        return MapToDto(plan);
    }

    public async Task<BirthdayPlanDto> UpdatePlanAsync(Guid childId, UpdateBirthdayPlanDto dto)
    {
        var plan = await _birthdays.GetByChildIdAsync(childId);
        if (plan == null) throw new KeyNotFoundException("Birthday plan not found.");

        plan.Theme = dto.Theme;
        plan.Location = dto.Location;
        plan.Notes = dto.Notes;
        plan.Date = dto.Date;

        await _birthdays.UpdateAsync(plan);
        return MapToDto(plan);
    }

    public async Task<BirthdayGuestDto> AddGuestAsync(Guid childId, AddBirthdayGuestDto dto)
    {
        var plan = await _birthdays.GetByChildIdAsync(childId);
        if (plan == null) throw new KeyNotFoundException("Birthday plan not found.");

        var guest = new BirthdayGuest
        {
            Id = Guid.NewGuid(),
            BirthdayPlanId = plan.Id,
            Name = dto.Name,
            Status = "Pending",
            AdditionalAdults = 0,
            AdditionalChildren = 0
        };
        await _birthdays.AddGuestAsync(guest);
        return new BirthdayGuestDto(guest.Id, guest.Name, guest.Status, guest.AdditionalAdults, guest.AdditionalChildren, guest.SubGuestsJson);
    }

    public async Task UpdateGuestAsync(Guid guestId, UpdateGuestDto dto)
    {
        var guest = await _birthdays.GetGuestByIdAsync(guestId);
        if (guest == null) throw new KeyNotFoundException("Guest not found.");

        guest.Status = dto.Status;
        guest.AdditionalAdults = dto.AdditionalAdults;
        guest.AdditionalChildren = dto.AdditionalChildren;
        guest.SubGuestsJson = dto.SubGuests;
        await _birthdays.UpdateGuestAsync(guest);
    }
    
    public async Task DeleteGuestAsync(Guid guestId) => await _birthdays.RemoveGuestAsync(guestId);

    private BirthdayPlanDto MapToDto(BirthdayPlan p) =>
        new BirthdayPlanDto(p.Id, p.ChildId, p.Theme, p.Location, p.Notes, p.Date,
            p.Guests.Select(g => new BirthdayGuestDto(g.Id, g.Name, g.Status, g.AdditionalAdults, g.AdditionalChildren, g.SubGuestsJson)));
}
