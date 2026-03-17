using BabyTracker.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BabyTracker.Api.Controllers;

[Authorize]
[Route("api/[controller]")]
public class PhotosController : BaseApiController
{
    private readonly PhotoService _photos;
    public PhotosController(PhotoService photos) => _photos = photos;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid childId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _photos.GetByChildAsync(childId, page, pageSize);
        return Ok(result);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload([FromQuery] Guid childId, IFormFile file, [FromForm] string? notes)
    {
        await using var stream = file.OpenReadStream();
        var result = await _photos.UploadAsync(
            GetUserId(), childId, stream, file.FileName, file.ContentType, notes);
        return CreatedAtAction(nameof(GetAll), null, result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        await _photos.DeleteAsync(id, GetUserId());
        return NoContent();
    }
}
