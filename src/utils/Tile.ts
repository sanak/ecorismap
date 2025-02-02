import { TileRegionType } from '../types';

export function tileGridForRegion(region: TileRegionType, minZoom: number, maxZoom: number) {
  let tiles: { x: number; y: number; z: number }[] = [];

  for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
    const subTiles = tilesForZoom(region, zoom);
    tiles = [...tiles, ...subTiles];
  }

  return tiles;
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
function lonToTileX(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function latToTileY(lat: number, zoom: number): number {
  return Math.floor(
    ((1 - Math.log(Math.tan(degToRad(lat)) + 1 / Math.cos(degToRad(lat))) / Math.PI) / 2) * Math.pow(2, zoom)
  );
}

function tilesForZoom(region: TileRegionType, zoom: number): { x: number; y: number; z: number }[] {
  const minLon = region.coords[0].longitude;
  const minLat = region.coords[0].latitude;
  const maxLon = region.coords[2].longitude;
  const maxLat = region.coords[2].latitude;

  const minTileX = lonToTileX(minLon, zoom);
  const maxTileX = lonToTileX(maxLon, zoom);
  const minTileY = latToTileY(maxLat, zoom);
  const maxTileY = latToTileY(minLat, zoom);

  const tiles: { x: number; y: number; z: number }[] = [];

  for (let x = minTileX; x <= maxTileX + 1; x++) {
    for (let y = minTileY; y <= maxTileY + 1; y++) {
      tiles.push({ x, y, z: zoom });
    }
  }

  return tiles;
}
