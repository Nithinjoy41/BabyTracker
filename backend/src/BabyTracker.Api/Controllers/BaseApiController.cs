using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace BabyTracker.Api.Controllers;

[ApiController]
public abstract class BaseApiController : ControllerBase
{
    protected Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException());

    protected Guid GetFamilyId() =>
        Guid.Parse(User.FindFirstValue("FamilyId")
            ?? throw new UnauthorizedAccessException("User is not part of a family."));
}
