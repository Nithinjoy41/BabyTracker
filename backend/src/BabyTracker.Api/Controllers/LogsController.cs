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
    public async Task<IActionResult> GetAll([FromQuery] Guid childId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _logs.GetByChildAsync(childId, page, pageSize);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromQuery] Guid childId, [FromBody] CreateLogEntryDto dto)
    {
        var result = await _logs.CreateAsync(GetUserId(), childId, dto);
        return CreatedAtAction(nameof(GetAll), null, result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        await _logs.DeleteAsync(id, GetUserId());
        return NoContent();
    }
}
