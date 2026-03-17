using BabyTracker.Application.DTOs;
using BabyTracker.Application.Interfaces;
using BabyTracker.Domain.Entities;

namespace BabyTracker.Application.Services;

public class VaccineService
{
    private readonly IVaccineRepository _vaccines;
    private readonly IUserRepository _users;

    public VaccineService(IVaccineRepository vaccines, IUserRepository users)
    {
        _vaccines = vaccines;
        _users = users;
    }

    public async Task<VaccineResponseDto> CreateAsync(Guid userId, Guid familyId, CreateVaccineDto dto)
    {
        var vaccine = new Vaccine
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId,
            UserId = userId,
            Name = dto.Name,
            Date = dto.Date,
            Notes = dto.Notes
        };
        await _vaccines.CreateAsync(vaccine);
        var user = await _users.GetByIdAsync(userId);
        return new VaccineResponseDto(vaccine.Id, vaccine.Name, vaccine.Date, vaccine.Notes, user!.FullName);
    }

    public async Task<PagedResult<VaccineResponseDto>> GetByFamilyAsync(Guid familyId, int page, int pageSize)
    {
        var (items, total) = await _vaccines.GetByFamilyAsync(familyId, page, pageSize);
        var dtos = items.Select(v => new VaccineResponseDto(v.Id, v.Name, v.Date, v.Notes, v.User.FullName));
        return new PagedResult<VaccineResponseDto>(dtos, total, page, pageSize);
    }

    public async Task DeleteAsync(Guid id, Guid familyId)
    {
        var vaccine = await _vaccines.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Vaccine not found.");
        if (vaccine.FamilyId != familyId)
            throw new UnauthorizedAccessException();
        await _vaccines.DeleteAsync(id);
    }
}
