# Delivery Route Optimizer

## Hackathon Project Report

**Problem Statement:** Delivery Route Optimizer

**GitHub Repository:**  
https://github.com/kundansreeteja-cloud/DeliveryRouteOptimizer

---

## 1. Project Introduction

### Project Title
**Delivery Route Optimizer**

### Project Idea

Delivery Route Optimizer is a web-based application that finds an optimal delivery route for a vehicle visiting multiple customer locations.

The vehicle starts from a selected depot, visits every customer exactly once, and returns to the depot while minimizing the total travel distance.

The problem is modeled as the **Travelling Salesman Problem (TSP)**.

### Problem Domain

The project belongs to:

- Route Optimization
- Algorithm Design
- Delivery Planning
- Combinatorial Optimization


---

## 2. The Challenge

In a delivery scenario, visiting customers in an arbitrary order may result in unnecessary travel and higher delivery costs.

The main challenge is to determine an optimal sequence of locations such that:

1. The vehicle starts from the selected depot.
2. Every customer is visited exactly once.
3. The vehicle returns to the depot.
4. The total travel distance is minimized.

As the number of locations increases, the number of possible routes grows very rapidly. Therefore, an efficient optimization approach is required for finding the best route for the supported problem size.

---

## 3. Our Solution

We developed an interactive **Delivery Route Optimizer** that allows users to enter customer locations and their coordinates.

The application:

- Manages customer locations.
- Allows the starting depot to be selected.
- Calculates distances between locations.
- Creates a distance matrix.
- Runs exact TSP optimization algorithms.
- Reconstructs the optimal route.
- Displays the total distance.
- Displays execution and search statistics.
- Visualizes the optimized route.
- Allows comparison between two algorithms.

### Key Algorithms

The project implements:

1. **Dynamic Programming using the Held-Karp approach**
2. **Branch and Bound**

Both approaches are used to solve the TSP optimally for the supported input size.

---

## 4. How It Works

### System Workflow

```text
User Input
    ↓
Customer Locations & Coordinates
    ↓
Select Starting Depot
    ↓
Calculate Distance Matrix
    ↓
Select Algorithm
    ↓
Dynamic Programming / Branch & Bound
    ↓
Find Optimal Route
    ↓
Calculate Total Distance & Statistics
    ↓
Visualize the Optimized Route