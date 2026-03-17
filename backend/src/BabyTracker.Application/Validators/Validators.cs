using BabyTracker.Application.DTOs;
using FluentValidation;

namespace BabyTracker.Application.Validators;

public class RegisterDtoValidator : AbstractValidator<RegisterDto>
{
    public RegisterDtoValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6).MaximumLength(100);
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
    }
}

public class LoginDtoValidator : AbstractValidator<LoginDto>
{
    public LoginDtoValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class JoinFamilyDtoValidator : AbstractValidator<JoinFamilyDto>
{
    public JoinFamilyDtoValidator()
    {
        RuleFor(x => x.InviteCode).NotEmpty().Length(6, 8);
    }
}

public class CreateLogEntryDtoValidator : AbstractValidator<CreateLogEntryDto>
{
    public CreateLogEntryDtoValidator()
    {
        RuleFor(x => x.Type).NotEmpty().Must(t => t is "Food" or "Nappy" or "Sleep")
            .WithMessage("Type must be Food, Nappy, or Sleep.");
        RuleFor(x => x.Timestamp).NotEmpty();
        RuleFor(x => x.DurationMinutes).GreaterThan(0).When(x => x.DurationMinutes.HasValue);
        RuleFor(x => x.Notes).MaximumLength(1000);
    }
}

public class CreateVaccineDtoValidator : AbstractValidator<CreateVaccineDto>
{
    public CreateVaccineDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Date).NotEmpty();
        RuleFor(x => x.Notes).MaximumLength(1000);
    }
}
