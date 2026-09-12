import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../api/products';
import ProductGrid from '../components/product/ProductGrid.jsx';
import FilterSidebar from '../components/product/FilterSidebar.jsx';
import Loader from '../components/layout/Loader.jsx';
import useDebounce from '../hooks/useDebounce';

function paramsToFilters(params) {
  const f = {
    search: params.get('search') || '',
    category: params.get('category') || '',
    listing_type: params.get('listing_type') || '',
    city: params.get('city') || '',
    min: params.get('min') || '',
    max: params.get('max') || '',
    sort: params.get('sort') || 'recent',
    page: Number(params.get('page')) || 1,
    limit: 20,
  };
  return f;
}

function filtersToParams(f) {
  const out = {};
  for (const [k, v] of Object.entries(f)) {
    if (v === '' || v == null) continue;
    out[k] = String(v);
  }
  return out;
}

export default function ListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => paramsToFilters(searchParams));
  const [search, setSearch] = useState(filters.search);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setFilters((f) => ({ ...f, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  useEffect(() => {
    setSearchParams(filtersToParams(filters), { replace: true });
  }, [filters, setSearchParams]);

  const queryFilters = useMemo(() => {
    const q = { ...filters };
    Object.keys(q).forEach((k) => { if (q[k] === '' || q[k] == null) delete q[k]; });
    return q;
  }, [filters]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', queryFilters],
    queryFn: () => productsApi.list(queryFilters),
    keepPreviousData: true,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        <FilterSidebar filters={filters} onChange={(next) => setFilters(next)} />
        <section>
          <div className="flex items-center gap-3 mb-4">
            <input
              type="search"
              placeholder="Search listings…"
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {isFetching && <span className="text-xs text-slate-400">updating…</span>}
          </div>

          {isLoading ? (
            <Loader />
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-3">{data?.total ?? 0} results</p>
              <ProductGrid items={data?.items || []} emptyText="No listings match your filters." />
              {data && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button className="btn-secondary"
                          disabled={filters.page <= 1}
                          onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>
                    Previous
                  </button>
                  <span className="text-sm text-slate-600">Page {filters.page} of {totalPages}</span>
                  <button className="btn-secondary"
                          disabled={filters.page >= totalPages}
                          onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
