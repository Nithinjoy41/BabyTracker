using BabyTracker.Application.DTOs;
using BabyTracker.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BabyTracker.Api.Controllers;

[Authorize]
[Route("api/[controller]")]
public class BirthdayController : BaseApiController
{
    private readonly BirthdayService _birthdays;
    public BirthdayController(BirthdayService birthdays) => _birthdays = birthdays;

    [HttpGet("{childId}")]
    public async Task<IActionResult> GetPlan(Guid childId)
    {
        var plan = await _birthdays.GetOrCreatePlanAsync(childId);
        return Ok(plan);
    }

    [HttpPut("{childId}")]
    public async Task<IActionResult> UpdatePlan(Guid childId, [FromBody] UpdateBirthdayPlanDto dto)
    {
        var plan = await _birthdays.UpdatePlanAsync(childId, dto);
        return Ok(plan);
    }

    [HttpPost("{childId}/guests")]
    public async Task<IActionResult> AddGuest(Guid childId, [FromBody] AddBirthdayGuestDto dto)
    {
        var guest = await _birthdays.AddGuestAsync(childId, dto);
        return Ok(guest);
    }

    [HttpPatch("guests/{guestId}/status")]
    public async Task<IActionResult> UpdateGuestStatus(Guid guestId, [FromBody] UpdateGuestStatusDto dto)
    {
        await _birthdays.UpdateGuestStatusAsync(guestId, dto.Status);
        return NoContent();
    }

    [HttpDelete("guests/{guestId}")]
    public async Task<IActionResult> DeleteGuest(Guid guestId)
    {
        await _birthdays.DeleteGuestAsync(guestId);
        return NoContent();
    }
}
