package com.example.qrganize.item;

import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.qrganize.R;
import com.example.qrganize.container.ContainerActivity;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ItemListAdapter extends RecyclerView.Adapter<ItemListAdapter.ItemViewHolder> {

    private List<ItemModel> itemList;
    private Context context;

    public ItemListAdapter(List<ItemModel> itemList, Context context) {
        this.itemList = itemList;
        this.context = context;
    }

    @NonNull
    @Override
    public ItemViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View itemView = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_layout, parent, false);
        return new ItemViewHolder(itemView);
    }

    @Override
    public void onBindViewHolder(@NonNull ItemViewHolder holder, int position) {
        holder.bind(itemList.get(position));
    }

    @Override
    public int getItemCount() {
        return itemList.size();
    }

    public class ItemViewHolder extends RecyclerView.ViewHolder {
        private FrameLayout frame;
        private Map<String, TextView> idMap;
        private Map<String, TextView> nameMap;
        private ImageView imageView;

        public ItemViewHolder(@NonNull View itemView) {
            super(itemView);
            frame = itemView.findViewById(R.id.frame);
            idMap = buildLabelTextviewPair(itemView, R.id.id);
            nameMap = buildLabelTextviewPair(itemView, R.id.name);
            imageView = itemView.findViewById(R.id.image);

            frame.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    Intent intent = new Intent(context, ItemActivity.class);
                    intent.putExtra("barcode", idMap.get("text").getText().toString());
                    context.startActivity(intent);
                }
            });
        }

        public void bind(ItemModel item) {
            setLabelTextviewPair(idMap, "ID", item.getId());
            setLabelTextviewPair(nameMap, "Name", item.getName());
            imageView.setImageBitmap(item.getBitmapImage());
        }

        private Map<String, TextView> buildLabelTextviewPair(View itemView, int view) {
            Map<String, TextView> map = new HashMap<>();
            View includedLayout = itemView.findViewById(view);
            TextView labelView = includedLayout.findViewById(R.id.label);
            TextView textView = includedLayout.findViewById(R.id.textview);
            map.put("label", labelView);
            map.put("text", textView);

            return map;
        }

        private void setLabelTextviewPair(Map<String, TextView> pair, String label, String text) {
            pair.get("label").setText(label);
            pair.get("text").setText(text);
        }
    }
}
