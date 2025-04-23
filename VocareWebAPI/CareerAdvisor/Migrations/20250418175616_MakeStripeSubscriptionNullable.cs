using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class MakeStripeSubscriptionNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "StripeSubscriptionId",
                schema: "Identity",
                table: "UserBillings",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "ServiceName",
                schema: "Identity",
                table: "TokenTransactions",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ServiceName",
                schema: "Identity",
                table: "TokenTransactions");

            migrationBuilder.AlterColumn<string>(
                name: "StripeSubscriptionId",
                schema: "Identity",
                table: "UserBillings",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }
    }
}
