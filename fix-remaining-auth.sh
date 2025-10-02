#!/bin/bash

echo "Fixing remaining authOptions(req) calls..."

# Fix all the files
sed -i '' 's/authOptions(req)/authOptions/g' pages/api/state.ts
sed -i '' 's/authOptions(req)/authOptions/g' pages/api/share/youshared.ts
sed -i '' 's/authOptions(req)/authOptions/g' pages/api/share/deleteyoushared.ts
sed -i '' 's/authOptions(req)/authOptions/g' pages/api/share/delete.ts
sed -i '' 's/authOptions(req)/authOptions/g' pages/api/pdb/op.ts
sed -i '' 's/authOptions(req)/authOptions/g' pages/api/market/op.ts

echo "Fixed all remaining authOptions calls!"