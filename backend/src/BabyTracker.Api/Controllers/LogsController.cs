using BabyTracker.Application.DTOs;
using BabyTracker.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BabyTracker.Api.Controllers;

[Authorize]
[Route("api/[controller]")]
public class LogsController : BaseApiController
{
    private readonly LogService _logs;
    public LogsController(LogService logs) => _logs = logs;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _logs.GetByFamilyAsync(GetFamilyId(), page, pageSize);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLogEntryDto dto)
    {
        var result = await _logs.CreateAsync(GetUserId(), GetFamilyId(), dto);
        return CreatedAtAction(nameof(GetAll), null, result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        await _logs.DeleteAsync(id, GetFamilyId());
        return NoContent();
    }
}
