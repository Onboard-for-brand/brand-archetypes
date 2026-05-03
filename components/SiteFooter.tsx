import { I18nText } from "@/components/I18nText";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>EDUPUNK</div>
        <div className="category-markers">
          <span className="cat--active">
            ◉ <I18nText zh="文具" en="stationery" />
          </span>
          <span>
            □ <I18nText zh="武具" en="weapon" />
          </span>
          <span className="cat--active">
            ◉ <I18nText zh="工具" en="tool" />
          </span>
        </div>
      </div>
    </footer>
  );
}
