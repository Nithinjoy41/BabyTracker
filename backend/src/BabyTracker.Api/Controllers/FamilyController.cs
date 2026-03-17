using BabyTracker.Application.DTOs;
using BabyTracker.Application.Interfaces;
using BabyTracker.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BabyTracker.Api.Controllers;

[Authorize]
[Route("api/[controller]")]
public class FamilyController : BaseApiController
{
    private readonly IFamilyRepository _families;
    private readonly InviteService _invites;

    public FamilyController(IFamilyRepository families, InviteService invites)
    {
        _families = families;
        _invites = invites;
    }

    [HttpPost("invite")]
    public async Task<IActionResult> GenerateInvite([FromBody] GenerateInviteDto dto)
    {
        var familyId = GetFamilyId();
        var code = await _invites.GenerateInviteAsync(familyId, dto.Email);
        return Ok(new InviteResponseDto(code, DateTime.UtcNow.AddDays(7)));
    }

    [HttpGet]
    public async Task<IActionResult> GetMyFamily()
    {
        var familyId = GetFamilyId();
        var family = await _families.GetByIdAsync(familyId);
        if (family is null) return NotFound();
        return Ok(new
        {
            family.Id,
            family.Name,
            family.InviteCode,
            Members = family.Members.Select(m => new { m.User.FullName, m.Role, m.JoinedAt })
        });
    }
}
