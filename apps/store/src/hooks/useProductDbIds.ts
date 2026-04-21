import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** Maps mock product names → Supabase product UUIDs */
export const useProductDbIds = (productNames: string[]) => {
  const [idMap, setIdMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (productNames.length === 0) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name')
        .in('name', productNames)
        .eq('is_published', true);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(p => { map[p.name] = p.id; });
        setIdMap(map);
      }
    };
    fetch();
  }, [productNames.join(',')]);

  return idMap;
};
