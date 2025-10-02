#!/bin/bash

echo "Fixing all accessToken destructuring..."

# Fix each file by replacing the destructuring with safe access
files=(
    "pages/api/state.ts"
    "pages/api/requestOp.ts"
    "pages/api/market/op.ts"
    "pages/api/pdb/op.ts"
    "pages/api/share/deleteyoushared.ts"
    "pages/api/share/youshared.ts"
    "pages/api/share/delete.ts"
)

for file in "${files[@]}"; do
    echo "Fixing $file..."
    sed -i '' 's/const { accessToken } = session;/const accessToken = (session as any).accessToken || (session as any).token?.accessToken || "";/g' "$file"
done

echo "Done! Fixed all accessToken references."