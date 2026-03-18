using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BabyTracker.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class FixBirthdayMapping : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BirthdayPlans_Children_ChildId1",
                table: "BirthdayPlans");

            migrationBuilder.DropIndex(
                name: "IX_BirthdayPlans_ChildId1",
                table: "BirthdayPlans");

            migrationBuilder.DropColumn(
                name: "ChildId1",
                table: "BirthdayPlans");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ChildId1",
                table: "BirthdayPlans",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_BirthdayPlans_ChildId1",
                table: "BirthdayPlans",
                column: "ChildId1");

            migrationBuilder.AddForeignKey(
                name: "FK_BirthdayPlans_Children_ChildId1",
                table: "BirthdayPlans",
                column: "ChildId1",
                principalTable: "Children",
                principalColumn: "Id");
        }
    }
}
