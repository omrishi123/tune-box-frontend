import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';

const Search = () => {
  const [searchResults, setSearchResults] = useState([]);

  return (
    <div>
      <h1>Search</h1>
      <SearchBar onResults={setSearchResults} />
      <div className="results">
        {searchResults.map(result => (
          <div key={result.id.videoId}>
            {/* Result item */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Search;
