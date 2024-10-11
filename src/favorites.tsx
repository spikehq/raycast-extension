import { ActionPanel, Detail, List, Action, Icon, Color } from "@raycast/api";
import { useEffect, useState } from "react";
import api from "./api";

interface Favorite {
  entityId: string;
  entityType: string;
  name: string;
  teamUid: string;
  team: string;
  url: string;
  counterId?: string;
}

const getIcon = (entityType: string) => {
  switch (entityType) {
    case "Incident":
      return "incident.png";
    case "Oncall":
      return "oncall.png";
    case "Escalation":
      return "escalation.png";
    case "Service":
      return "service.png";
    case "Integration":
      return "integration.png";
    default:
      return null;
  }
};

export default function Command() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  useEffect(() => {
    async function fetchFavorites() {
      const response = await api.users.getFavorites();
      const arrayObject = Object.values(response.favorites);
      setFavorites(arrayObject);
    }

    fetchFavorites();
  }, []);
  return (
    <List>
      <List.Section title="Favorites" subtitle={favorites.length + " items"}>
        {favorites.map((favorite) => (
          <FavoriteItem key={favorite.entityId} favorite={favorite} />
        ))}
      </List.Section>
    </List>
  );
}

function FavoriteItem({ favorite }: { favorite: Favorite }) {
  return (
    <List.Item
      title={favorite.name}
      subtitle={favorite.counterId ? favorite.counterId : undefined}
      icon={getIcon(favorite.entityType) || Icon.Star}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser title="Open favorite" url={`https://app.spike.sh${favorite.url}`} />
        </ActionPanel>
      }
    />
  );
}
