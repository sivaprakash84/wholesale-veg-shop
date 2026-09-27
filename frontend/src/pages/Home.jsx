import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

function Home() {
  const { t } = useLanguage();

  return (
    <div className="home-page">

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">

          <p className="hero-small">
            {t("wholesaleVegetableSupplier")}
          </p>

          <h1>
            {t("freshVegetablesDirect")}
            <br />
            {t("toYourBusiness")}
          </h1>

          <p className="hero-description">
            {t("freshQualityVegetablesWholesale")}
          </p>

          <div className="hero-buttons">
            <Link
              to="/products"
              className="hero-button"
            >
              {t("shopVegetables")} →
            </Link>

            <a
              href="#why-us"
              className="hero-outline-button"
            >
              {t("whyChooseUs")}
            </a>
          </div>

        </div>
      </section>


      {/* FEATURES */}
      <section
        className="features"
        id="why-us"
      >

        <div className="feature-card">
          <span>🥬</span>

          <h3>{t("freshStock")}</h3>

          <p>
            {t("freshStockDescription")}
          </p>
        </div>


        <div className="feature-card">
          <span>💰</span>

          <h3>{t("wholesalePrices")}</h3>

          <p>
            {t("wholesalePricesDescription")}
          </p>
        </div>


        <div className="feature-card">
          <span>🚚</span>

          <h3>{t("fastDelivery")}</h3>

          <p>
            {t("fastDeliveryDescription")}
          </p>
        </div>

      </section>


      {/* ABOUT SECTION */}
      <section className="about-section">

        <div className="about-image">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80"
            alt={t("freshVegetables")}
          />
        </div>

        <div className="about-content">

          <p className="section-label">
            {t("aboutOurShop")}
          </p>

          <h2>
            {t("trustedWholesalePartner")}
          </h2>

          <p>
            {t("aboutShopDescriptionOne")}
          </p>

          <p>
            {t("aboutShopDescriptionTwo")}
          </p>

          <Link
            to="/products"
            className="hero-button"
          >
            {t("viewVegetables")}
          </Link>

        </div>

      </section>


      {/* CTA */}
      <section className="cta-section">

        <h2>
          {t("readyToOrderVegetables")}
        </h2>

        <p>
          {t("browseStockAndOrder")}
        </p>

        <Link
          to="/products"
          className="hero-button"
        >
          {t("startShopping")} →
        </Link>

      </section>

    </div>
  );
}

export default Home;