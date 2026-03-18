using BabyTracker.Application.DTOs;
using BabyTracker.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BabyTracker.Api.Controllers;

[Route("api/[controller]")]
public class ChildrenController : BaseApiController
{
    private readonly ChildService _children;
    public ChildrenController(ChildService children) => _children = children;

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetChildren()
    {
        var children = await _children.GetChildrenAsync(GetUserId());
        return Ok(children);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> AddChild([FromBody] CreateChildDto dto)
    {
        var familyId = GetFamilyId();
        var child = await _children.AddChildAsync(familyId, dto);
        return Ok(child);
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteChild(Guid id)
    {
        await _children.DeleteChildAsync(id, GetUserId());
        return NoContent();
    }
}
