using BabyTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BabyTracker.Api.Controllers;

[Authorize]
[Route("api/[controller]")]
public class FamilyController : BaseApiController
{
    private readonly IFamilyRepository _families;

    public FamilyController(IFamilyRepository families) => _families = families;

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
