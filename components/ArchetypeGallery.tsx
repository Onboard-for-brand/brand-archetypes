import Image from "next/image";
import { I18nText } from "@/components/I18nText";
import { archetypes } from "@/lib/archetypes";

export function ArchetypeGallery() {
  return (
    <div className="avatar-gallery">
      {archetypes.map((archetype) => (
        <div className="avatar-tile" key={archetype.id}>
          <div className="avatar-tile__face">
            <Image
              src={archetype.avatar}
              alt={`${archetype.nameEn} archetype portrait`}
              width={112}
              height={112}
            />
          </div>
          <div className="avatar-tile__name">
            <I18nText block zh={archetype.nameZh} en={archetype.nameEn} />
          </div>
        </div>
      ))}
    </div>
  );
}
