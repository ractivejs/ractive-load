import Ractive from 'ractive';
import rcu from 'rcu';
import loadFromLinks from './load/fromLinks';
import loadSingle from './load/single';
import loadMultiple from './load/multiple';

rcu.init( Ractive );

function load ( url ) {
	var baseUrl = load.baseUrl;
	var cache = load.cache !== false;

	if ( !url ) {
		return loadFromLinks( baseUrl, cache );
	}

	if ( typeof url === 'object' ) {
		return loadMultiple( url, baseUrl, cache );
	}

	return loadSingle( url, baseUrl, baseUrl, cache );
}

load.baseUrl = '';
load.modules = {};

export default load;
