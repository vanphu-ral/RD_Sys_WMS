"""
GraphQL API configuration
"""
import strawberry
from strawberry.fastapi import GraphQLRouter

# Import resolvers from modules
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

# Create GraphQL schema
schema = strawberry.Schema(query=Query, mutation=Mutation)