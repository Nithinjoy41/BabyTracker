using BabyTracker.Application.Interfaces;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;

namespace BabyTracker.Infrastructure.Storage;

public class CloudinaryStorageService : IFileStorageService
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryStorageService(IConfiguration config)
    {
        var account = new Account(
            config["Cloudinary:CloudName"],
            config["Cloudinary:ApiKey"],
            config["Cloudinary:ApiSecret"]
        );
        _cloudinary = new Cloudinary(account);
        _cloudinary.Api.Secure = true;
    }

    public async Task<string> SaveFileAsync(Stream stream, string fileName, string contentType)
    {
        var uploadParams = new ImageUploadParams()
        {
            File = new FileDescription(fileName, stream),
            Folder = "babytracker_photos"
        };
        
        var uploadResult = await _cloudinary.UploadAsync(uploadParams);
        return uploadResult.SecureUrl.ToString();
    }

    public async Task DeleteFileAsync(string url)
    {
        if (string.IsNullOrEmpty(url)) return;
        
        try
        {
            var uri = new Uri(url);
            var filename = uri.Segments.Last();
            var publicId = "babytracker_photos/" + Path.GetFileNameWithoutExtension(filename);
            
            var deleteParams = new DeletionParams(publicId);
            await _cloudinary.DestroyAsync(deleteParams);
        }
        catch
        {
            // Ignore deletion errors or log them
        }
    }
}
