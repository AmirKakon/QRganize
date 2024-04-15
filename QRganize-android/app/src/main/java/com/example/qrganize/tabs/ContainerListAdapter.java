package com.example.qrganize.tabs;

import android.content.Context;
import android.content.Intent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.qrganize.R;
import com.example.qrganize.container.ContainerActivity;
import com.example.qrganize.container.ContainerModel;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ContainerListAdapter extends RecyclerView.Adapter<ContainerListAdapter.ItemViewHolder> {

    private List<ContainerModel> containerList;
    private Context context;

    public ContainerListAdapter(List<ContainerModel> containerList, Context context) {
        this.containerList = containerList;
        this.context = context;
    }

    @NonNull
    @Override
    public ItemViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View itemView = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.container_item_layout, parent, false);
        return new ItemViewHolder(itemView);
    }

    @Override
    public void onBindViewHolder(@NonNull ItemViewHolder holder, int position) {
        holder.bind(containerList.get(position));
    }

    @Override
    public int getItemCount() {
        return containerList.size();
    }

    public class ItemViewHolder extends RecyclerView.ViewHolder {
        private FrameLayout frame;
        private Map<String, TextView> idMap;
        private Map<String, TextView> nameMap;
        private Map<String, TextView> ownerMap;

        private Map<String, TextView> itemCountMap;

        public ItemViewHolder(@NonNull View itemView) {
            super(itemView);
            frame = itemView.findViewById(R.id.frame);
            idMap = buildLabelTextviewPair(itemView, R.id.id);
            nameMap = buildLabelTextviewPair(itemView, R.id.name);
            ownerMap = buildLabelTextviewPair(itemView, R.id.owner);
            itemCountMap = buildLabelTextviewPair(itemView, R.id.item_count);

            frame.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    Intent intent = new Intent(context, ContainerActivity.class);
                    intent.putExtra("containerId", idMap.get("text").getText().toString());
                    context.startActivity(intent);
                }
            });
        }

        public void bind(ContainerModel item) {
            setLabelTextviewPair(idMap, "ID", item.getId());
            setLabelTextviewPair(nameMap, "Name", item.getName());
            setLabelTextviewPair(ownerMap, "Owner", item.getOwner());
            setLabelTextviewPair(itemCountMap, "Items", String.valueOf(item.getItems().size()));
        }

        private Map<String, TextView> buildLabelTextviewPair(View itemView, int view) {
            Map<String, TextView> map = new HashMap<>();
            View includedLayout = itemView.findViewById(view);
            TextView labelView = includedLayout.findViewById(R.id.label);
            TextView textView = includedLayout.findViewById(R.id.textview);
            map.put("label", labelView);
            map.put("text",textView);

            return map;
        }

        private void setLabelTextviewPair(Map<String, TextView> pair,  String label, String textView) {
            pair.get("label").setText(label);
            pair.get("text").setText(textView);
        }
    }
}
