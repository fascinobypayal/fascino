import { Link } from 'react-router-dom';
import { DbCollection } from '@/hooks/useProducts';

interface CollectionCardProps {
  collection: DbCollection;
}

export const CollectionCard = ({ collection }: CollectionCardProps) => {
  return (
    <Link
      to={`/collection/${collection.id}`}
      className="group relative block aspect-[3/4] overflow-hidden"
    >
      <div className="absolute inset-0">
        {collection.image_url ? (
          <img
            src={collection.image_url}
            alt={collection.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground text-xs">No image</div>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-transparent transition-opacity duration-300 group-hover:from-charcoal/80" />
      <div className="absolute inset-0 flex flex-col justify-end p-5">
        <h3 className="font-serif text-xl text-white tracking-wide">
          {collection.name}
        </h3>
      </div>
    </Link>
  );
};

export default CollectionCard;
