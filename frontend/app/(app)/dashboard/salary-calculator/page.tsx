import SalaryCalculator from '@/features/salary-calculator/components/SalaryCalculator';

export default function DashboardSalaryCalculatorPage() {
  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      <h1 className="font-poppins text-2xl font-semibold">Kalkulator wynagrodzeń</h1>
      <p className="text-muted-foreground font-poppins mt-1 text-sm">
        Porównaj kwotę na rękę dla umowy o pracę, zlecenia, dzieła i B2B.
      </p>
      <SalaryCalculator className="mt-6" />
    </div>
  );
}
