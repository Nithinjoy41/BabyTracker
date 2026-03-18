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
            Members = family.Members.Select(m => new { m.UserId, m.User.FullName, m.Role, m.JoinedAt })
        });
    }

    [HttpDelete("members/{memberUserId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid memberUserId)
    {
        var familyId = GetFamilyId();
        var currentUserId = GetUserId();
        
        var callerMembership = await _families.GetMemberAsync(currentUserId, familyId);
        if (callerMembership == null) return Unauthorized();

        // Allow removing yourself, or if you are the Owner
        if (currentUserId != memberUserId && callerMembership.Role != "Owner")
        {
            return Forbid();
        }

        await _families.RemoveMemberAsync(memberUserId, familyId);
        return NoContent();
    }
}
