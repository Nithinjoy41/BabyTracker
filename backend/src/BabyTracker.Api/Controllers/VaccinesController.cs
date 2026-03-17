using BabyTracker.Application.DTOs;
using BabyTracker.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BabyTracker.Api.Controllers;

[Authorize]
[Route("api/[controller]")]
public class VaccinesController : BaseApiController
{
    private readonly VaccineService _vaccines;
    public VaccinesController(VaccineService vaccines) => _vaccines = vaccines;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _vaccines.GetByFamilyAsync(GetFamilyId(), page, pageSize);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVaccineDto dto)
    {
        var result = await _vaccines.CreateAsync(GetUserId(), GetFamilyId(), dto);
        return CreatedAtAction(nameof(GetAll), null, result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        await _vaccines.DeleteAsync(id, GetFamilyId());
        return NoContent();
    }
}
