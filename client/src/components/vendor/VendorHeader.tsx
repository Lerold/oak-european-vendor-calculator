interface Props {
  name: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  welcomeText?: string | null;
}

export default function VendorHeader({ name, logoUrl, bannerUrl, welcomeText }: Props) {
  return (
    <div className="vendor-header">
      {bannerUrl && (
        <img src={bannerUrl} alt="" className="vendor-banner" />
      )}
      <div className="vendor-header-content">
        {logoUrl && (
          <img src={logoUrl} alt={name} className="vendor-logo" />
        )}
        <h2 className="vendor-name">{name}</h2>
        {welcomeText && (
          <p className="vendor-welcome">{welcomeText}</p>
        )}
      </div>
    </div>
  );
}
