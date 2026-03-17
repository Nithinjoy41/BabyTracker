using BabyTracker.Application.DTOs;
using BabyTracker.Application.Interfaces;
using BabyTracker.Domain.Entities;

namespace BabyTracker.Application.Services;

public class VaccineService
{
    private readonly IVaccineRepository _vaccines;
    private readonly IUserRepository _users;
    private readonly IChildRepository _children;
    private readonly IFamilyRepository _families;

    public VaccineService(IVaccineRepository vaccines, IUserRepository users, IChildRepository children, IFamilyRepository families)
    {
        _vaccines = vaccines;
        _users = users;
        _children = children;
        _families = families;
    }

    public async Task<VaccineResponseDto> CreateAsync(Guid userId, Guid childId, CreateVaccineDto dto)
    {
        var child = await _children.GetByIdAsync(childId) 
            ?? throw new KeyNotFoundException("Child not found.");
            
        // Security check: Is user in this child's family?
        var membership = await _families.GetMemberAsync(userId, child.FamilyId);
        if (membership == null) throw new UnauthorizedAccessException();

        var vaccine = new Vaccine
        {
            Id = Guid.NewGuid(),
            FamilyId = child.FamilyId,
            ChildId = childId,
            UserId = userId,
            Name = dto.Name,
            Date = dto.Date,
            Notes = dto.Notes
        };
        await _vaccines.CreateAsync(vaccine);
        var user = await _users.GetByIdAsync(userId);
        return new VaccineResponseDto(vaccine.Id, vaccine.Name, vaccine.Date, vaccine.Notes, user!.FullName);
    }

    public async Task<PagedResult<VaccineResponseDto>> GetByChildAsync(Guid childId, int page, int pageSize)
    {
        var (items, total) = await _vaccines.GetByChildAsync(childId, page, pageSize);
        var dtos = items.Select(v => new VaccineResponseDto(v.Id, v.Name, v.Date, v.Notes, v.User.FullName));
        return new PagedResult<VaccineResponseDto>(dtos, total, page, pageSize);
    }

    public async Task DeleteAsync(Guid id, Guid userId)
    {
        var vaccine = await _vaccines.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Vaccine not found.");
            
        // Security check: Is user in this family?
        var membership = await _families.GetMemberAsync(userId, vaccine.FamilyId);
        if (membership == null) throw new UnauthorizedAccessException();

        await _vaccines.DeleteAsync(id);
    }
}
