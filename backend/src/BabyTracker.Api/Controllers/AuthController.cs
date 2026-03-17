using BabyTracker.Application.DTOs;
using BabyTracker.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BabyTracker.Api.Controllers;

[Route("api/[controller]")]
public class AuthController : BaseApiController
{
    private readonly AuthService _auth;
    public AuthController(AuthService auth) => _auth = auth;

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var result = await _auth.RegisterAsync(dto);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await _auth.LoginAsync(dto);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("join-family")]
    public async Task<IActionResult> JoinFamily([FromBody] JoinFamilyDto dto)
    {
        var result = await _auth.JoinFamilyAsync(GetUserId(), dto.InviteCode);
        return Ok(result);
    }
}
