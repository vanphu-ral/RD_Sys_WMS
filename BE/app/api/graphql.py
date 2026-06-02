"""
GraphQL API configuration
"""
import strawberry
from strawberry.fastapi import GraphQLRouter
from starlette.requests import Request

from app.modules.inventory.resolvers import InventoryQuery, InventoryMutation
from app.modules.inventory.dashboard_resolver import DashboardQuery
from app.modules.locations.resolvers import LocationQuery, LocationMutation

@strawberry.type
class Query(InventoryQuery, LocationQuery, DashboardQuery):
    """Root GraphQL Query"""
    pass

@strawberry.type
class Mutation(InventoryMutation, LocationMutation):
    """Root GraphQL Mutation"""
    pass

def get_graphql_context(request: Request) -> dict:
    auth_header = request.headers.get("authorization")
    user = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            from app.core.security import verify_keycloak_token
            user_info = verify_keycloak_token(token)
            if user_info:
                branch = user_info.get("branch")
                if branch is None:
                    groups = user_info.get("groups", [])
                    for group in groups:
                        if isinstance(group, str) and group.startswith("branch_"):
                            branch = group[7:]
                            break
                user = {
                    "sub": user_info.get("sub"),
                    "preferred_username": user_info.get("preferred_username"),
                    "name": user_info.get("name"),
                    "email": user_info.get("email"),
                    "roles": user_info.get("realm_access", {}).get("roles", []),
                    "groups": user_info.get("groups", []),
                    "branch": branch,
                    "factory": user_info.get("factory")
                }
        except Exception:
            user = None
    return {"user": user}

schema = strawberry.Schema(query=Query, mutation=Mutation)

graphql_app = GraphQLRouter(
    schema,
    context_getter=get_graphql_context,
)