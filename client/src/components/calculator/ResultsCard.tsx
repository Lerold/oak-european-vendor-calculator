interface ResultData {
  depositAmount: number;
  principal: number;
  monthlyPaymentExclVat: number;
  monthlyPaymentInclVat: number;
  quarterlyPaymentExclVat: number;
  quarterlyPaymentInclVat: number;
  vatAmountMonthly: number;
  totalLeaseExclVat: number;
  totalLeaseInclVat: number;
  termMonths: number;
}

interface CountryInfo {
  name: string;
  code: string;
  currencyCode: string;
  vatRate: number;
  showLocalCurrency: boolean;
}

interface Props {
  result: ResultData;
  country: CountryInfo;
  equipmentValue: number;
}

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function ResultsCard({ result, country, equipmentValue }: Props) {
  const fmt = (n: number) => formatCurrency(n, country.currencyCode);

  return (
    <div className="results-card">
      <h2>Estimated Leasing Costs</h2>
      <p className="results-subtitle">
        {country.name} — {result.termMonths} months
      </p>

      <div className="results-grid">
        <div className="result-block result-highlight">
          <span className="result-label">Monthly Payment</span>
          <span className="result-value-large">{fmt(result.monthlyPaymentExclVat)}</span>
          <span className="result-sub">excl. VAT</span>
          <span className="result-value">{fmt(result.monthlyPaymentInclVat)}</span>
          <span className="result-sub">incl. VAT ({country.vatRate}%)</span>
        </div>

        <div className="result-block">
          <span className="result-label">Quarterly Payment</span>
          <span className="result-value">{fmt(result.quarterlyPaymentExclVat)}</span>
          <span className="result-sub">excl. VAT</span>
          <span className="result-value">{fmt(result.quarterlyPaymentInclVat)}</span>
          <span className="result-sub">incl. VAT</span>
        </div>
      </div>

      <div className="results-breakdown">
        <h3>Breakdown</h3>
        <table className="breakdown-table">
          <tbody>
            <tr>
              <td>Equipment Value</td>
              <td>{fmt(equipmentValue)}</td>
            </tr>
            {result.depositAmount > 0 && (
              <tr>
                <td>Deposit / Advance</td>
                <td>{fmt(result.depositAmount)}</td>
              </tr>
            )}
            <tr>
              <td>Amount Financed</td>
              <td>{fmt(result.principal)}</td>
            </tr>
            <tr>
              <td>Monthly VAT ({country.vatRate}%)</td>
              <td>{fmt(result.vatAmountMonthly)}</td>
            </tr>
            <tr className="breakdown-total">
              <td>Total Lease Cost (excl. VAT)</td>
              <td>{fmt(result.totalLeaseExclVat)}</td>
            </tr>
            <tr className="breakdown-total">
              <td>Total Lease Cost (incl. VAT)</td>
              <td>{fmt(result.totalLeaseInclVat)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="results-disclaimer">
        These figures are indicative estimates only. Actual leasing terms may vary
        based on credit assessment, equipment type, and other factors. Request a
        formal quote for accurate pricing.
      </p>
    </div>
  );
}
