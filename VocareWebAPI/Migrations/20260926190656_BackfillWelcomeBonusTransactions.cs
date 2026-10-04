using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class BackfillWelcomeBonusTransactions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                INSERT INTO public."TokenTransactions" ("UserId", "ServiceName", "Amount", "Type", "CreatedAt")
                SELECT ub."UserId", 'WelcomeBonus-Backfill', 120, 2, NOW()
                FROM public."UserBillings" ub
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM public."TokenTransactions" tt
                    WHERE tt."UserId" = ub."UserId"
                      AND tt."Type" = 2
                );
                """
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DELETE FROM public."TokenTransactions"
                WHERE "Type" = 2
                  AND "ServiceName" = 'WelcomeBonus-Backfill';
                """
            );
        }
    }
}
